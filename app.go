package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

type AppConfig struct {
	WindowX      int    `json:"windowX"`
	WindowY      int    `json:"windowY"`
	WindowWidth  int    `json:"windowWidth"`
	WindowHeight int    `json:"windowHeight"`
	BackupOnSave bool   `json:"backupOnSave"`
	BackupDir    string `json:"backupDir"`
	Language     string `json:"language"`
}

func getConfigPath() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(exe)
	return filepath.Join(dir, "Kardoo.appconfig"), nil
}

func (a *App) LoadConfig() (AppConfig, error) {
	path, err := getConfigPath()
	if err != nil {
		return AppConfig{WindowWidth: 1200, WindowHeight: 800}, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return AppConfig{WindowWidth: 1200, WindowHeight: 800}, nil
	}
	var cfg AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return AppConfig{WindowWidth: 1200, WindowHeight: 800}, nil
	}
	return cfg, nil
}

func (a *App) SaveConfig(cfg AppConfig) error {
	path, err := getConfigPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	cfg, err := a.LoadConfig()
	if err == nil && cfg.WindowX > 0 && cfg.WindowY > 0 {
		runtime.WindowSetPosition(ctx, cfg.WindowX, cfg.WindowY)
	}
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

func (a *App) SaveVCardFile(path string, content string, backup bool, backupDir string) error {
	// Backup avant sauvegarde
	if backup && path != "" {
		dir := backupDir
		if dir == "" {
			dir = filepath.Dir(path)
		}
		if err := os.MkdirAll(dir, 0755); err == nil {
			base := filepath.Base(path)
			ext := filepath.Ext(base)
			name := base[:len(base)-len(ext)]
			// Timestamp dans le nom du backup
			backupPath := filepath.Join(dir, name+"_backup_"+time.Now().Format("20060102_150405")+ext)
			if data, err := os.ReadFile(path); err == nil {
				os.WriteFile(backupPath, data, 0644)
			}
		}
	}

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

func (a *App) ChooseDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choisir le dossier de backup",
	})
}

func (a *App) GetWindowPosition() (map[string]int, error) {
	x, y := runtime.WindowGetPosition(a.ctx)
	w, h := runtime.WindowGetSize(a.ctx)
	return map[string]int{"x": x, "y": y, "width": w, "height": h}, nil
}

func (a *App) SetWindowPosition(x, y, w, h int) {
	runtime.WindowSetPosition(a.ctx, x, y)
	runtime.WindowSetSize(a.ctx, w, h)
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

func (a *App) SaveContactPhoto(base64Data string, defaultName string) error {
	// Détecter le type d'image
	mimeType := "image/jpeg"
	ext := ".jpg"
	if strings.Contains(base64Data, "image/png") {
		mimeType = "image/png"
		ext = ".png"
	}
	_ = mimeType

	// Extraire la partie base64 pure
	data := base64Data
	if idx := strings.Index(base64Data, ","); idx != -1 {
		data = base64Data[idx+1:]
	}

	decoded, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return err
	}

	file, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Sauvegarder la photo",
		DefaultFilename: defaultName + ext,
		Filters: []runtime.FileFilter{
			{DisplayName: "Images", Pattern: "*" + ext},
		},
	})
	if err != nil || file == "" {
		return err
	}

	return os.WriteFile(file, decoded, 0644)
}

func (a *App) NewVCardFile() (map[string]string, error) {
	file, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Créer un nouveau fichier vCard",
		DefaultFilename: "contacts.vcf",
		Filters: []runtime.FileFilter{
			{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"},
		},
	})
	if err != nil || file == "" {
		return nil, err
	}
	return map[string]string{"path": file}, nil
}

func (a *App) ExportContact(content string, defaultName string) error {
	file, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Exporter le contact",
		DefaultFilename: defaultName + ".vcf",
		Filters: []runtime.FileFilter{
			{DisplayName: "vCard (*.vcf)", Pattern: "*.vcf"},
		},
	})
	if err != nil || file == "" {
		return err
	}
	return os.WriteFile(file, []byte(content), 0644)
}
func (a *App) ExportToFile(content string, defaultName string, ext string) error {
	filterName := "VCF"
	switch ext {
	case ".json":
		filterName = "JSON"
	case ".csv":
		filterName = "CSV"
	case ".xml":
		filterName = "XML"
	}

	file, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Exporter les contacts",
		DefaultFilename: defaultName + ext,
		Filters: []runtime.FileFilter{
			{DisplayName: filterName + " (*" + ext + ")", Pattern: "*" + ext},
		},
	})
	if err != nil || file == "" {
		return err
	}
	return os.WriteFile(file, []byte(content), 0644)
}

func (a *App) ExportToFolder(files map[string]string) error {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choisir le dossier d'export",
	})
	if err != nil || dir == "" {
		return err
	}
	for name, content := range files {
		path := filepath.Join(dir, name)
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			return err
		}
	}
	return nil
}

func (a *App) saveWindowState(ctx context.Context) {
	cfg, _ := a.LoadConfig()
	x, y := runtime.WindowGetPosition(ctx)
	w, h := runtime.WindowGetSize(ctx)
	if w > 100 && h > 100 && w < 5000 && h < 3000 {
		cfg.WindowX = x
		cfg.WindowY = y
		cfg.WindowWidth = w
		cfg.WindowHeight = h
		a.SaveConfig(cfg)
	}
}

func (a *App) WindowMinimise() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) WindowToggleMaximise() {
	runtime.WindowToggleMaximise(a.ctx)
}

func (a *App) WindowClose() {
	runtime.Quit(a.ctx)
}
