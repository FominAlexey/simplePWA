import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISPLAY_OPTIONS = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];

/**
 * Создает новый PWA-проект на основе ответов пользователя или переданных опций
 * @param {string} projectName - Имя проекта
 * @param {object} options - Необязательные параметры (manifest, silent и т.д.)
 * @returns {Promise<{projectDir: string, manifest: object, manifestConfig: object}>}
 */
export async function createPWAProject(projectName, options = {}) {
  if (!projectName) {
    throw new Error('Необходимо указать название проекта');
  }

  const projectDir = path.join(process.cwd(), projectName);
  if (fs.existsSync(projectDir)) {
    throw new Error(`Директория "${projectName}" уже существует.`);
  }

  // Используем переданные опции или спрашиваем пользователя
  const manifestConfig = options.manifest ||
    await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Название приложения:',
        default: projectName
      },
      {
        type: 'input',
        name: 'shortName',
        message: 'Короткое название (до 12 символов):',
        default: projectName,
        validate: (input) => input.length <= 12 || 'Не более 12 символов'
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
        validate: (input) => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Введите корректный hex (например, #ffffff)'
      },
      {
        type: 'input',
        name: 'themeColor',
        message: 'Цвет темы (hex code):',
        default: '#2196f3',
        validate: (input) => /^#[0-9A-Fa-f]{6}$/.test(input) || 'Введите hex, например #2196f3'
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

  // Подготовка manifest.json
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

  const templateDir = path.join(__dirname, '..', 'templates');

  // Копируем основные файлы шаблона
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

  // Записываем manifest.json
  fs.writeFileSync(
    path.join(projectDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Копируем иконки, если выбрано
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

  if (!options.silent) {
    console.log(`\nPWA проект "${projectName}" успешно создан!`);
    console.log('\nДальнейшие шаги:');
    console.log(`  1. cd ${projectName}`);
    console.log('  2. Настройте файлы под свои нужды');
    console.log('  3. Запустите локальный сервер, проверьте работу PWA');
    console.log('  4. Добавьте свои страницы, стили и логику! 🚀\n');
    console.log('Удачной разработки!\n');
  }

  return { projectDir, manifest, manifestConfig };
}

// Функция main для CLI
export async function main() {
  try {
    // Проверка имени проекта
    const projectName = process.argv[2];
    if (!projectName) {
      console.error('Пожалуйста, укажите название проекта');
      process.exit(1);
    }

    await createPWAProject(projectName);

    console.log(`\nPWA project "${projectName}" создан успешно!`);
    console.log('\nСледующие шаги:');
    console.log(`  1. Перейдите в директорию проекта:\n     cd ${projectName}`);
    console.log('  2. Настройте файлы по своим нуждам');
    console.log('  3. Запустите локальный сервер и проверьте работу PWA');
    console.log('  4. Добавьте свои страницы, стили и логику! 🚀\n');
    console.log('Удачной разработки!\n');
  } catch (error) {
    console.error('Ошибка при создании проекта:', error.message);
    process.exit(1);
  }
}

// Запускаем main только если файл выполняется напрямую
if (import.meta.url === fileURLToPath(import.meta.url)) {
  main();
}
