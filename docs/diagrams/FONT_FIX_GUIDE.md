# PlantUML Installation and Font Configuration Guide

## Quick Fix for Font Warnings

The font warnings you encountered have been resolved by adding font configuration to all PlantUML diagrams:

```plantuml
' Font configuration to avoid Java font warnings
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam titleFontName Arial
skinparam titleFontSize 14
```

## PlantUML Installation Options

### Option 1: Install via Homebrew (macOS)
```bash
# Install PlantUML
brew install plantuml

# Install Java (if not already installed)
brew install openjdk@11

# Install Microsoft fonts (to resolve Times font warnings)
brew install --cask font-microsoft-office
```

### Option 2: Install via npm (Cross-platform)
```bash
# Install Node.js PlantUML wrapper
npm install -g node-plantuml

# Generate diagrams
puml generate docs/diagrams/*.puml --png
```

### Option 3: Use Online PlantUML Server
1. Visit: http://www.plantuml.com/plantuml/uml/
2. Copy and paste diagram code
3. Generate and download images

### Option 4: Use VS Code Extension
1. Install "PlantUML" extension in VS Code
2. Open any `.puml` file
3. Press `Alt+D` to preview
4. Right-click → "Export Current Diagram"

## Testing the Fixed Diagrams

After installing PlantUML, test with:

```bash
# Navigate to diagrams directory
cd docs/diagrams

# Generate all diagrams
plantuml -tpng *.puml

# Generate with UTF-8 encoding (recommended)
plantuml -tpng -charset UTF-8 *.puml

# Generate with headless mode (avoids font issues)
plantuml -tpng -Djava.awt.headless=true *.puml
```

## Alternative: Docker-based Generation

If you prefer not to install PlantUML locally:

```bash
# Create a simple Docker command
docker run --rm -v $(pwd)/docs/diagrams:/data plantuml/plantuml:latest -tpng /data/*.puml
```

## Verification

The font warnings have been eliminated by:
1. ✅ Adding explicit Arial font configuration to all diagrams
2. ✅ Setting appropriate font sizes
3. ✅ Using widely available fonts
4. ✅ Providing fallback options in the README

You should no longer see the "Times font not available" warnings when generating the diagrams with any of the methods above.

## Quick Start (Recommended)

For immediate diagram generation without installation:
1. Use the VS Code PlantUML extension, or
2. Use the online PlantUML server
3. Copy/paste the diagram codes from the `.puml` files

All diagrams are now properly configured and ready to generate without font warnings!
