#!/bin/bash
# cleanup_cursor_logs.sh
# Script to clean up Cursor IDE log files to prevent excessive disk usage

# Location of project
PROJECT_DIR="/Users/lazmini/code/meeting-mcp"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Project directory not found at $PROJECT_DIR"
  exit 1
fi

# Check if .cursor directory exists
CURSOR_DIR="$PROJECT_DIR/.cursor"
if [ ! -d "$CURSOR_DIR" ]; then
  echo "No .cursor directory found. Nothing to clean up."
  exit 0
fi

# Current size before cleanup
BEFORE_SIZE=$(du -sh "$CURSOR_DIR" | awk '{print $1}')
echo "Current .cursor directory size: $BEFORE_SIZE"

# Backup important rules files that are not logs
BACKUP_DIR="$PROJECT_DIR/.cursor_backup"
mkdir -p "$BACKUP_DIR"

# Save the rule definitions (not the log content)
if [ -d "$CURSOR_DIR/rules" ]; then
  for file in "$CURSOR_DIR/rules"/*.mdc; do
    if [ -f "$file" ]; then
      # Extract just the first few lines which contain rule definitions
      head -n 10 "$file" > "$BACKUP_DIR/$(basename "$file")"
    fi
  done
  echo "Backed up rule definitions to $BACKUP_DIR"
fi

# Remove or truncate large log files
find "$CURSOR_DIR" -type f -name "*.log" -exec truncate -s 0 {} \;
echo "Truncated log files"

# Optional: Completely remove the mdc files which contain the full API specs
# Uncomment if you want to remove these completely
# find "$CURSOR_DIR/rules" -type f -name "*.mdc" -delete
# echo "Removed rule definition files"

# Or alternatively, truncate them to just include the essential metadata
for file in "$CURSOR_DIR/rules"/*.mdc; do
  if [ -f "$file" ]; then
    # Keep only the first few lines with metadata and truncate the rest
    head -n 10 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done
echo "Truncated rule definition files to essential metadata"

# After cleanup size
AFTER_SIZE=$(du -sh "$CURSOR_DIR" | awk '{print $1}')
echo "New .cursor directory size: $AFTER_SIZE"

echo "Cleanup complete!" 