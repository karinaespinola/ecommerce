# 🛒 E-Commerce Platform

A modern, full-stack e-commerce platform built with Laravel and React, featuring an admin dashboard for product management and a customer-facing storefront for users to browse and purchase products.

## 🎯 Purpose

This platform provides a complete e-commerce solution with two main interfaces:

1. **🛍️ Customer Storefront**: A public-facing website where users can:
   - 🔍 Browse products and categories
   - 🛒 Add items to a shopping cart
   - 💳 Make purchases as **logged-in users** (with account benefits)
   - 📦 View order history (for authenticated users)

2. **⚙️ Admin Dashboard**: A protected administrative interface where authorized users can:
   - 📋 Manage product catalog (products, categories, variants)
   - 🖼️ Handle product attributes and images
   - 📊 Monitor orders and inventory
   - ⚙️ Configure platform settings

## 🛠️ Technologies Used

### 🔧 Backend

- **Laravel 12**: Modern PHP framework providing robust backend architecture, routing, and ORM
- **PHP 8.2+**: Latest PHP version with improved performance and type safety
- **Laravel Fortify**: Authentication system handling login, registration, password reset, and two-factor authentication
- **Inertia.js**: Seamlessly connects Laravel backend with React frontend, eliminating the need for a separate API
- **SQLite**: Default database for development (easily configurable for production with MySQL/PostgreSQL)

### 🎨 Frontend

- **React 19**: Modern React library for building interactive user interfaces
- **TypeScript**: Type-safe JavaScript for better code quality and developer experience
- **Inertia.js React**: React adapter for Inertia.js, enabling server-driven React components
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **Radix UI**: Accessible, unstyled component primitives for building UI components
- **Headless UI**: Completely unstyled, fully accessible UI components
- **Lucide React**: Beautiful icon library

### 🧰 Development Tools
- **ESLint & Prettier**: Code quality and formatting tools for JavaScript/TypeScript
- **Laravel Wayfinder**: Type-safe route generation for TypeScript

## ✨ Key Features

### 🔐 User Authentication
- 👤 User registration and login

### 🛒 E-Commerce Functionality
- **📦 Product Catalog**: Browse products organized by categories
- **🎨 Product Variants**: Products with multiple attributes (size, color, etc.)
- **🛒 Shopping Cart**: Add, update, and remove items from cart
- **💳 Authenticated Checkout**: Enhanced experience for logged-in users
- **📋 Order Management**: Track orders and order history
- **🖼️ Image Management**: Upload and manage product images

### 👨‍💼 Admin Features
- 📝 Product CRUD operations
- 📂 Category management
- 🏷️ Attribute and variant management
- 📤 Image upload and organization
- 📊 Order tracking and management

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/    # Laravel controllers
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic services
│   └── Actions/             # Fortify authentication actions
├── resources/
│   ├── js/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Inertia page components
│   │   ├── layouts/         # Layout components
│   │   └── routes/          # Type-safe route definitions
│   └── css/                 # Global styles
├── database/
│   ├── migrations/          # Database schema migrations
│   └── seeders/             # Database seeders
└── routes/
    └── web.php              # Application routes
```

## 🚀 Getting Started

### 📋 Prerequisites

- **🐳 Docker** (must be installed and running)
- 📥 Git

### 💻 Installation

1. **Clone the repository:**
```bash
git clone git@github.com:karinaespinola/ecommerce.git
cd ecommerce
```

2. **Create the `.env` file by copying the example:**
```bash
cp .env.example .env
```

3. **Install PHP dependencies:**
```bash
composer install
```

4. **Start the Docker containers using Laravel Sail:**
```bash
./vendor/bin/sail up
```

> ⚠️ **Important**: Make sure Docker is installed and running before executing this command.

5. **Run database migrations and seeders:**
```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

6. **After the containers are up, install JavaScript dependencies:**
```bash
./vendor/bin/sail artisan npm install
```

7. **Build and watch for frontend changes:**
```bash
./vendor/bin/sail npm run dev
```

8. **Start the queue worker** (run in a separate terminal window/tab):
```bash
./vendor/bin/sail artisan queue:work
```

9. **Start the task scheduler** (run in a separate terminal window/tab):
```bash
./vendor/bin/sail artisan schedule:work
```

> 💡 **Note**: Steps 8 and 9 should be run in separate terminal windows/tabs as they are long-running processes. The scheduler handles scheduled tasks like daily sales reports.

The application is now up and running! 🎉

### 🌐 Accessing the Application

- **🛍️ Storefront**: Visit [http://localhost](http://localhost) to view the customer-facing store
- **⚙️ Admin Dashboard**: Visit [http://localhost/admin/login](http://localhost/admin/login) to access the admin panel
- **📧 MailHog**: Visit [http://localhost:8025](http://localhost:8025) to view and test emails sent by the application

**🔑 Admin Login Credentials:**
- 📧 Email: `test@example.com`
- 🔒 Password: `password`

Now you can start customizing your store! 🎨


## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
