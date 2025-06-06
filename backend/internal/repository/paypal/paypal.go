package paypal

import (
	"context"
	"esports_club_booking/internal/config"
	"esports_club_booking/internal/repository"
	"fmt"
	"net/http"
	"strconv"

	paypal "github.com/plutov/paypal/v4"
)

var _ repository.PayPalClient = (*PayPalClient)(nil)

type PayPalClient struct {
	Client *paypal.Client

	WebHookID string
	ReturnURL string
	CancelURL string
}

func NewPayPalClient(cfg *config.Config) (*PayPalClient, error) {
	client, err := paypal.NewClient(cfg.PayPal.ClientID, cfg.PayPal.Secret, paypal.APIBaseSandBox)
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	_, err = client.GetAccessToken(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	// Turn on only for debugging purposes
	// client.SetLog(os.Stdout)
	return &PayPalClient{
		Client:    client,
		WebHookID: cfg.PayPal.WebhookID,
		ReturnURL: cfg.PayPal.ReturnURL,
		CancelURL: cfg.PayPal.CancelURL,
	}, nil
}

func (p *PayPalClient) Deposit(amount float64, userID int64, description string) (string, string, error) {
	unit := []paypal.PurchaseUnitRequest{
		{
			Amount: &paypal.PurchaseUnitAmount{
				Currency: "USD",
				Value:    fmt.Sprintf("%.2f", amount),
			},
			CustomID: strconv.FormatInt(userID, 10),
		},
	}

	appContext := &paypal.ApplicationContext{
		ReturnURL: p.ReturnURL,
		CancelURL: p.CancelURL,
	}

	// Remove the empty PaymentSource parameter
	order, err := p.Client.CreateOrder(
		context.Background(),
		paypal.OrderIntentCapture,
		unit,
		nil, // Don't pass PaymentSource here
		appContext,
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to create order: %w", err)
	}

	// Find approval URL
	var redirectURL string
	for _, link := range order.Links {
		if link.Rel == "approve" {
			redirectURL = link.Href
			break
		}
	}

	if redirectURL == "" {
		return "", "", fmt.Errorf("no approval link found in order response")
	}

	return order.ID, redirectURL, nil
}

func (p *PayPalClient) VerifyWebhook(ctx context.Context, r *http.Request) error {
	// Verify the webhook signature
	sig, err := p.Client.VerifyWebhookSignature(ctx, r, p.WebHookID)
	if err != nil {
		return fmt.Errorf("failed to verify webhook signature: %w", err)
	}

	// Check if verification succeeded
	if sig.VerificationStatus != "SUCCESS" {
		return fmt.Errorf("webhook verification failed: %s", sig.VerificationStatus)
	}

	return nil
}
