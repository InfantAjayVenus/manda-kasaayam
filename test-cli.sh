#!/bin/bash

echo "🧪 Testing manda CLI installation..."

# Test 1: Direct execution
echo "1. Testing direct execution..."
npm start -- --help

# Test 2: Global link
echo -e "\n2. Testing global link..."
pnpm link --global
if command -v manda &> /dev/null; then
    echo "✅ manda command is available globally"
    manda --help
    pnpm unlink --global
else
    echo "❌ manda command not found after linking"
fi

# Test 3: npm pack
echo -e "\n3. Testing npm pack..."
pnpm build
npm pack
PACKAGE_FILE=$(ls manda-kasaayam-*.tgz | head -n 1)

if [ -n "$PACKAGE_FILE" ]; then
    echo "✅ Package created: $PACKAGE_FILE"
    
    # Test installation from package
    mkdir -p test-install
    cd test-install
    pnpm add ../$PACKAGE_FILE
    
    if npx manda --help &> /dev/null; then
        echo "✅ CLI works from installed package"
    else
        echo "❌ CLI failed from installed package"
    fi
    
    cd ..
    rm -rf test-install
else
    echo "❌ Failed to create package"
fi

echo -e "\n🎉 Testing complete!"