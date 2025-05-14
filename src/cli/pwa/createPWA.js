import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISPLAY_OPTIONS = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];

async function main() {
  // Проверка имени проекта
  const projectName = process.argv[2];
  if (!projectName) {
    console.error('Пожалуйста, укажите название проекта');
    process.exit(1);
  }

  const projectDir = path.join(process.cwd(), projectName);
  if (fs.existsSync(projectDir)) {
    console.error(`Директория "${projectName}" уже существует.`);
    process.exit(1);
  }

  // Запрос параметров манифеста
  const manifestConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Название приложения:',
      default: projectName
    },
    {
      type: 'input',
      name: 'shortName',
      message: 'Короткое название (для стартового экрана):',
      default: projectName,
      validate: (input) => input.length <= 12 || 'Краткое имя должно содержать не более 12 символов'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Описание:',
      default: 'Progressive Web Application'
    },
    {
      type: 'list',
      name: 'display',
      message: 'Display mode:',
      choices: DISPLAY_OPTIONS,
      default: 'standalone'
    },
    {
      type: 'input',
      name: 'backgroundColor',
      message: 'Background color (hex code):',
      default: '#ffffff',
      validate: (input) => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Пожалуйста, введите действительный hex color код (e.g., #ffffff)'
    },
    {
      type: 'input',
      name: 'themeColor',
      message: 'Цвет темы (hex code):',
      default: '#2196f3',
      validate: (input) => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Пожалуйста, введите действительный hex color код (e.g., #2196f3)'
    },
    {
      type: 'confirm',
      name: 'generateIcons',
      message: 'Добавить иконки по умолчанию?',
      default: true
    }
  ]);

  // Создание структуры директорий
  fs.mkdirSync(projectDir, { recursive: true });

  // Подготовка манифеста
  const manifest = {
    name: manifestConfig.name,
    short_name: manifestConfig.shortName,
    description: manifestConfig.description,
    start_url: '.',
    display: manifestConfig.display,
    background_color: manifestConfig.backgroundColor,
    theme_color: manifestConfig.themeColor,
    icons: [
      {
        src: 'icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };

  // Копирование шаблонов
  const templateDir = path.join(__dirname, '..', 'templates');

  // Копируем основные файлы
  ['index.html', 'serviceWorker.js', 'offline.html'].forEach(file => {
    const src = path.join(templateDir, file);
    const dest = path.join(projectDir, file);
    if (fs.existsSync(src)) {
      let content = fs.readFileSync(src, 'utf8');
      if (file === 'index.html') {
        content = content.replace(/{{APP_NAME}}/g, manifestConfig.name)
                         .replace(/{{THEME_COLOR}}/g, manifestConfig.themeColor);
      }
      fs.writeFileSync(dest, content);
    }
  });

  // Записываем настроенный manifest.json
  fs.writeFileSync(
    path.join(projectDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Копируем иконки, если пользователь выбрал эту опцию
  if (manifestConfig.generateIcons) {
    const iconsDir = path.join(templateDir, 'icons');
    const targetIconsDir = path.join(projectDir, 'icons');
    if (fs.existsSync(iconsDir)) {
      fs.mkdirSync(targetIconsDir, { recursive: true });
      fs.readdirSync(iconsDir).forEach(icon => {
        fs.copyFileSync(
          path.join(iconsDir, icon),
          path.join(targetIconsDir, icon)
        );
      });
    }
  }

  console.log(`\nPWA project "${projectName}" created successfully!`);
  console.log('\nNext steps:');
  console.log(`  1. Перейдите в директорию проекта:\n     cd ${projectName}`);
  console.log('  2. Настройте файлы по своим нуждам');
  console.log('  3. Запустите локальный сервер и проверьте работу PWA');
  console.log('  4. Добавьте свои страницы, стили и логику! 🚀\n');
  console.log('Удачной разработки!\n');
}

main();
