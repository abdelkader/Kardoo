package main

import (
	"context"
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Ouvre un dialogue pour choisir un fichier .vcf
func (a *App) OpenVCardFile() (map[string]string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Ouvrir un fichier vCard",
		Filters: []runtime.FileFilter{
			{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"},
		},
	})
	if err != nil {
		return nil, err // ← nil au lieu de ""
	}
	if file == "" {
		return nil, nil // ← utilisateur a annulé
	}

	content, err := os.ReadFile(file)
	if err != nil {
		return nil, err // ← nil au lieu de ""
	}

	return map[string]string{
		"path":    file,
		"content": string(content),
	}, nil
}

func (a *App) OpenImageFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choisir une photo",
		Filters: []runtime.FileFilter{
			{DisplayName: "Images (*.jpg, *.jpeg, *.png)", Pattern: "*.jpg;*.jpeg;*.png"},
		},
	})
	if err != nil || file == "" {
		return "", err
	}

	// Lire le fichier et le convertir en base64
	content, err := os.ReadFile(file)
	if err != nil {
		return "", err
	}

	// Détecter le type MIME
	ext := strings.ToLower(filepath.Ext(file))
	mimeType := "image/jpeg"
	if ext == ".png" {
		mimeType = "image/png"
	}

	encoded := base64.StdEncoding.EncodeToString(content)
	return "data:" + mimeType + ";base64," + encoded, nil
}

func (a *App) SaveVCardFile(path string, content string) error {
	if path == "" {
		// Si pas de chemin, ouvrir un dialogue
		var err error
		path, err = runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
			Title:           "Sauvegarder le fichier vCard",
			DefaultFilename: "contacts.vcf",
			Filters: []runtime.FileFilter{
				{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"},
			},
		})
		if err != nil || path == "" {
			return err
		}
	}
	return os.WriteFile(path, []byte(content), 0644)
}

func (a *App) SaveToFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}
