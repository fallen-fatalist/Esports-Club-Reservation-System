package paypal

import (
	"fmt"
	"os"

	"github.com/plutov/paypal"
)

type PayPalClient struct {
	Client *paypal.Client
}

func NewPayPalClient(clientID, secret string) (*PayPalClient, error) {
	fmt.Println("Creating PayPal client with ID:", clientID)
	fmt.Println(secret)

	client, err := paypal.NewClient(clientID, secret, paypal.APIBaseSandBox)
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	_, err = client.GetAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	client.SetLog(os.Stdout)
	return &PayPalClient{Client: client}, nil
}

func (p *PayPalClient) Deposit(amount float64, receiverEmail string, description string) (string, error) {
	payer := &paypal.CreateOrderPayer{
		EmailAddress: receiverEmail,
	}
	unit := []paypal.PurchaseUnitRequest{
		{
			Amount: &paypal.PurchaseUnitAmount{
				Currency: "USD",
				Value:    fmt.Sprintf("%.2f", amount),
			},
		},
	}
	ApplicationContext := &paypal.ApplicationContext{
		ReturnURL: "https://github.com",
		CancelURL: "https://guthib.com",
	}

	order, err := p.Client.CreateOrder(paypal.OrderIntentCapture, unit, payer, ApplicationContext)
	if err != nil {
		return "", fmt.Errorf("failed to create order: %w", err)
	}

	var redirectURL string
	for _, link := range order.Links {
		if link.Rel == "approve" {
			redirectURL = link.Href
			break
		}
	}

	if redirectURL == "" {
		return "", fmt.Errorf("no approval link found in order response")
	}

	return redirectURL, nil
}

func (p *PayPalClient) CheckOrderStatus(orderID string) (string, error) {
	order, err := p.Client.GetOrder(orderID)
	if err != nil {
		return "", fmt.Errorf("failed to get order status: %w", err)
	}
	return order.Status, nil
}
