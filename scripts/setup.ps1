echo "========================================="
echo "SkillConnect - Project Setup"
echo "========================================="
echo "Installing Backend Dependencies..."
cd ../backend
npm install
npm run prisma:generate
echo "Installing Mobile Dependencies..."
cd ../mobile
npm install
echo "Setup Complete!"
