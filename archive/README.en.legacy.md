# mgit

`mgit` is a simple and practical Bash/Zsh and PowerShell script designed to help developers quickly run the same Git commands across all Git subdirectories under the current folder.

![image](assets/banner.jpg)

## Features
When you run this script in a directory containing multiple Git projects, it automatically iterates through all direct subdirectories and checks if they are Git repositories (by checking for the existence of a `.git` folder or file). If confirmed, it executes the specified Git command within that directory.

## Installation

### One-line Installation
You can run the following command directly in your terminal for an automated installation:

**Bash/Zsh / macOS / Linux**:
```bash
curl -fsSL https://raw.githubusercontent.com/doggy8088/mgit/main/install.sh | bash
```

**PowerShell / Windows / Cross-platform**:
```powershell
irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex
```

### Manual Installation
Alternatively, clone the repository and run the installation script locally:

**Bash/Zsh**:
```bash
git clone https://github.com/doggy8088/mgit.git
cd mgit
./install.sh
```

**PowerShell**:
```powershell
git clone https://github.com/doggy8088/mgit.git
cd mgit
.\install.ps1
```

## Usage

Once installed, navigate to your workspace containing Git subdirectories and run the command in your terminal:

### 1. Default Behavior
If executed without any arguments, the script defaults to running `git status -s`:
```bash
mgit
```

### 2. Custom Git Commands
You can pass any standard Git commands and parameters:
```bash
mgit pull
mgit log -n 1
mgit checkout main
```

## PowerShell Support

This project also includes `mgit.ps1` for Windows PowerShell or PowerShell Core (`pwsh`).

### Usage
```powershell
.\mgit.ps1
.\mgit.ps1 pull
.\mgit.ps1 log -n 1
```

## Screenshots
![screenshot](assets/screenshot.jpg)

## Key Benefits
*   **Automation**: Automatically detects directories containing a `.git` entry, completely ignoring non-git project directories.
*   **Visual Feedback**: Outputs clean ANSI color-coded logs, making the execution status of each repository immediately clear.
*   **Flexibility**: Supports all standard Git parameters and commands, ensuring the experience is identical to native Git usage.

## Notes
*   If you place the script manually, make sure it has executable permissions:
    ```bash
    chmod +x mgit
    ```
*   The script currently scans only the **first level** of subdirectories.
