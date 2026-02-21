package main

import (
	"context"
	"os"

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
func (a *App) OpenVCardFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Ouvrir un fichier vCard",
		Filters: []runtime.FileFilter{
			{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"},
		},
	})
	if err != nil || file == "" {
		return "", err
	}

	content, err := os.ReadFile(file)
	if err != nil {
		return "", err
	}

	return string(content), nil
}
