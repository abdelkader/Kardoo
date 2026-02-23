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

func (a *App) OpenVCardFile() (map[string]string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   "Ouvrir un fichier vCard",
		Filters: []runtime.FileFilter{{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"}},
	})
	if err != nil || file == "" {
		return nil, err
	}
	content, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}
	return map[string]string{"path": file, "content": string(content)}, nil
}

func (a *App) OpenImageFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   "Choisir une photo",
		Filters: []runtime.FileFilter{{DisplayName: "Images (*.jpg, *.jpeg, *.png)", Pattern: "*.jpg;*.jpeg;*.png"}},
	})
	if err != nil || file == "" {
		return "", err
	}
	content, err := os.ReadFile(file)
	if err != nil {
		return "", err
	}
	ext := strings.ToLower(filepath.Ext(file))
	mimeType := "image/jpeg"
	if ext == ".png" {
		mimeType = "image/png"
	}
	return "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(content), nil
}

func (a *App) SaveVCardFile(path string, content string) error {
	if path == "" {
		var err error
		path, err = runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
			Title:           "Sauvegarder le fichier vCard",
			DefaultFilename: "contacts.vcf",
			Filters:         []runtime.FileFilter{{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"}},
		})
		if err != nil || path == "" {
			return err
		}
	}
	return os.WriteFile(path, []byte(content), 0644)
}

func (a *App) OpenSoundFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choisir un fichier audio",
		Filters: []runtime.FileFilter{
			{DisplayName: "Audio (*.ogg, *.mp3, *.wav)", Pattern: "*.ogg;*.mp3;*.wav"},
		},
	})
	if err != nil || file == "" {
		return "", err
	}
	content, err := os.ReadFile(file)
	if err != nil {
		return "", err
	}
	ext := strings.ToLower(filepath.Ext(file))
	mimeMap := map[string]string{
		".ogg": "audio/ogg",
		".mp3": "audio/mpeg",
		".wav": "audio/wav",
	}
	mimeType := mimeMap[ext]
	if mimeType == "" {
		mimeType = "audio/ogg"
	}
	return "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(content), nil
}
