# Restore the user environment when Git is launched by a GUI on WSL.
if ! command -v node >/dev/null 2>&1; then
    config_home="${XDG_CONFIG_HOME:-$HOME/.config}"
    husky_init="$config_home/husky/init.sh"

    if [ -f "$husky_init" ]; then
        . "$husky_init"
    fi
fi

# Cover common user-level Node installations when no Husky init file exists.
if ! command -v node >/dev/null 2>&1; then
    for node_bin_directory in \
        "$HOME/.local/bin" \
        "$HOME/.proto/shims" \
        "$HOME/.volta/bin" \
        "$HOME/.asdf/shims" \
        "$HOME/.local/share/mise/shims"
    do
        if [ -x "$node_bin_directory/node" ]; then
            PATH="$node_bin_directory:$PATH"
            export PATH
            break
        fi
    done
fi

if ! command -v node >/dev/null 2>&1; then
    echo "husky - Node.js was not found in the Git hook environment" >&2
    echo "husky - configure Node in ~/.config/husky/init.sh" >&2
    exit 127
fi
