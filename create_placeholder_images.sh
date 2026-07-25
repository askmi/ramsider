#!/bin/bash

# Create simple placeholder images using ImageMagick (if available)
# Otherwise, just touch empty files

mkdir -p public/images/products

if command -v convert &> /dev/null; then
    echo "Creating placeholder images with ImageMagick..."
    
    # Hero image
    convert -size 800x1000 gradient:purple-black \
        -gravity center -pointsize 40 -fill white -annotate +0+0 "UNO LIGHT\nHero Image\n800x1000" \
        public/images/products/uno-light-hero.webp
    
    # Product cards
    for product in uno-light-product uno-pro-product uno-gold-product; do
        convert -size 600x800 gradient:purple-black \
            -gravity center -pointsize 30 -fill white -annotate +0+0 "${product^^}\n600x800" \
            public/images/products/${product}.webp
    done
    
    # Business lifestyle
    convert -size 1200x800 gradient:black-purple \
        -gravity center -pointsize 40 -fill white -annotate +0+0 "Business Lifestyle\n1200x800" \
        public/images/products/business-lifestyle.webp
    
    # Feature images
    for i in 1 2 3 4; do
        name=$([ $i -eq 1 ] && echo "display" || [ $i -eq 2 ] && echo "water" || [ $i -eq 3 ] && echo "materials" || echo "design")
        convert -size 800x600 gradient:purple-black \
            -gravity center -pointsize 30 -fill white -annotate +0+0 "Feature ${i}\n${name^^}\n800x600" \
            public/images/products/feature-${name}.webp
    done
    
    echo "✓ Placeholder images created with ImageMagick"
else
    echo "ImageMagick not found. Creating empty placeholder files..."
    touch public/images/products/uno-light-hero.webp
    touch public/images/products/{uno-light-product,uno-pro-product,uno-gold-product}.webp
    touch public/images/products/business-lifestyle.webp
    touch public/images/products/feature-{display,water,materials,design}.webp
    echo "✓ Empty placeholder files created"
fi

echo ""
echo "IMPORTANT: Replace these placeholder images with actual product renders!"
echo "See public/images/IMAGES_README.md for specifications"
