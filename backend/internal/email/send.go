package email

import (
	"crypto/tls"
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
	message.SetHeader("From", e.from)
	message.SetHeader("To", to)
	message.SetHeader("Subject", subject)
	message.SetBody("text/plain", body)

	dialer := gomail.NewDialer(e.smtpHost, e.smtpPort, e.from, e.password)

	// Gmail-specific settings
	dialer.TLSConfig = &tls.Config{
		ServerName: e.smtpHost, // Critical for Gmail
	}
	dialer.SSL = false // Force STARTTLS (port 587 behavior)

	// Test connection first
	s, err := dialer.Dial()
	if err != nil {
		return fmt.Errorf("SMTP Dial failed: %v", err)
	}
	defer s.Close()

	// Now send
	if err := gomail.Send(s, message); err != nil {
		return fmt.Errorf("SMTP Send failed: %v", err)
	}

	return nil
}
