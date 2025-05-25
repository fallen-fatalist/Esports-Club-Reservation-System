package config

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type (
	Config struct {
		Server      Server
		DataBase    DataBase
		JWT         JWTConfig
		EmailSender EmailSender
		PayPal      PayPal
	}

	Server struct {
		Adress string
		Port   string
	}

	DataBase struct {
		User     string
		Password string
		Host     string
		Port     string
		Name     string
	}

	JWTConfig struct {
		Secret     string
		Expiration time.Duration
	}

	EmailSender struct {
		FromAddress string
		SMTPHost    string
		SMTPPort    int64
		Password    string
	}

	PayPal struct {
		ClientID string
		Secret   string
	}
)

func NewConfig() *Config {
	var env string
	flag.StringVar(&env, "env", "prod", "Application environment (dev|prod)")
	flag.Parse()

	if env == "dev" {
		err := godotenv.Load("config/config.dev.env") // путь можешь адаптировать
		if err != nil {
			log.Fatal("Error loading config.dev.env")
		}
	}
	return &Config{
		Server: Server{
			Port: getEnvStr("PORT", "8080"),
		},
		DataBase: DataBase{
			User:     getEnvStr("DB_USER", "user"),
			Password: getEnvStr("DB_PASSWORD", "password"),
			Host:     getEnvStr("DB_HOST", "localhost"),
			Port:     getEnvStr("DB_PORT", "5432"),
			Name:     getEnvStr("DB_NAME", "booking_service"),
		},
		JWT: JWTConfig{
			Secret:     getEnvStr("JWT_SECRET", "supersecretkey"),
			Expiration: time.Duration(getEnvInt64("JWT_EXPIRATION", 60*60)) * time.Second, // default: 1 hour
		},
		EmailSender: EmailSender{
			FromAddress: getEnvStr("EMAIL_SENDER_FROM_ADDRESS", "esports.booking.service@gmail.com"),
			SMTPHost:    getEnvStr("EMAIL_SENDER_SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:    getEnvInt64("EMAIL_SENDER_SMTP_PORT", 587),
			Password:    getEnvStr("EMAIL_SENDER_APP_PASSWORD", ""),
		},
		PayPal: PayPal{
			ClientID: getEnvStr("PAYPAL_CLIENT_ID", ""),
			Secret:   getEnvStr("PAYPAL_CLIENT_SECRET", ""),
		},
	}
}

func (d *DataBase) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		d.User, d.Password, d.Host, d.Port, d.Name)
}

func getEnvStr(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if val, ok := os.LookupEnv(key); ok {
		v, err := strconv.ParseInt(val, 10, 64)
		if err == nil {
			return v
		}
	}
	return fallback
}
