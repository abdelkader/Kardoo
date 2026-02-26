package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	w, h := 1200, 800

	cfg, err := loadConfigForStartup()

	if err == nil {
		if cfg.WindowWidth > 0 {
			w = cfg.WindowWidth
		}
		if cfg.WindowHeight > 0 {
			h = cfg.WindowHeight
		}
	}

	fmt.Println("Final w:", w, "h:", h)

	err = wails.Run(&options.App{
		Title:     "Kardoo",
		Width:     w,
		Height:    h,
		Frameless: true,
		MinWidth:  600,
		MinHeight: 400,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnBeforeClose: func(ctx context.Context) bool {
			app.saveWindowState(ctx)
			return false
		},
		Bind: []interface{}{app},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}

func loadConfigForStartup() (AppConfig, error) {
	path, err := getConfigPath()
	if err != nil {
		return AppConfig{}, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return AppConfig{}, err
	}
	var cfg AppConfig
	return cfg, json.Unmarshal(data, &cfg)
}
