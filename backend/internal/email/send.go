package email

import (
	"fmt"

	"gopkg.in/gomail.v2"
)

type EmailSender struct {
	from     string // address from which you will send a message
	password string // password for app (not your actual password) to send message
	smtpHost string
	smtpPort int
}

func NewEmailSender(from, password, smtpHost string, smtpPort int) EmailSender {
	return EmailSender{from, password, smtpHost, smtpPort}
}

func (e EmailSender) SendEmail(to, subject, body string) error {
	message := gomail.NewMessage()
	fmt.Println(e.from, e.password)
	message.SetHeader("From", e.from)
	message.SetHeader("To", to)
	message.SetHeader("Subject", subject)
	message.SetBody("text/plain", body)

	dialer := gomail.NewDialer(e.smtpHost, e.smtpPort, e.from, e.password)
	if err := dialer.DialAndSend(message); err != nil {
		return fmt.Errorf("gomail.DialAndSend: %w", err)
	}
	return nil
}
