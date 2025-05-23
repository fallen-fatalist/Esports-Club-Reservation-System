package paypal_client

import "github.com/plutov/paypal/v4"

func NewClient(clientID, secret string) (*paypal.Client, error) {
	client, err := paypal.NewClient(clientID, secret, paypal.APIBaseSandBox)
	if err != nil {
		return nil, err
	}
	return client, nil
}
