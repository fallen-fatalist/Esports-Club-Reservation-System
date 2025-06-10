package exchangerateapi

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type ExchangeRateAPI struct {
	apiKey string
}

func NewExchangeRateAPI(apiKey string) ExchangeRateAPI {
	return ExchangeRateAPI{apiKey: apiKey}
}

func (e ExchangeRateAPI) GetUSDToKZT() (float64, error) {
	url := fmt.Sprintf("https://v6.exchangerate-api.com/v6/%s/pair/USD/KZT", e.apiKey)
	fmt.Println(url)
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var body struct {
		Result         string  `json:"result"`
		ConversionRate float64 `json:"conversion_rate"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return 0, err
	}

	if body.Result != "success" {
		return 0, fmt.Errorf("API error, result %s", body.Result)
	}

	return body.ConversionRate, nil
}
