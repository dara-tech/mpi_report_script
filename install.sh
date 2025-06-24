#!/bin/bash

# SQL Analyst - One-Click Installation Script
# This script automates the complete setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js version $(node -v) is compatible"
            return 0
        else
            print_error "Node.js version $(node -v) is too old. Please install Node.js 16 or higher."
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        return 1
    fi
}

# Function to check MySQL connection
check_mysql_connection() {
    if command_exists mysql; then
        print_status "Testing MySQL connection..."
        if mysql -u"$DB_USER" -p"$DB_PASSWORD" -h"$DB_HOST" -P"$DB_PORT" -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "MySQL connection successful"
            return 0
        else
            print_warning "Could not connect to MySQL. Please check your credentials."
            return 1
        fi
    else
        print_warning "MySQL client not found. Please ensure MySQL is installed and accessible."
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    print_status "Creating database '$DB_NAME' if it doesn't exist..."
    mysql -u"$DB_USER" -p"$DB_PASSWORD" -h"$DB_HOST" -P"$DB_PORT" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;" 2>/dev/null || {
        print_warning "Could not create database. Please create it manually or check permissions."
    }
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing main project dependencies..."
    npm install
    
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
}

# Function to setup environment file
setup_environment() {
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp env.example .env
        
        # Update .env with provided values
        sed -i.bak "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
        sed -i.bak "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
        sed -i.bak "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
        sed -i.bak "s/DB_USER=.*/DB_USER=$DB_USER/" .env
        sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
        
        rm .env.bak 2>/dev/null || true
        print_success "Environment file created and configured"
    else
        print_warning ".env file already exists. Skipping environment setup."
    fi
}

# Function to start the application
start_application() {
    print_status "Starting SQL Analyst application..."
    print_status "This will start both the backend and frontend servers."
    print_status "Press Ctrl+C to stop the application."
    echo ""
    print_success "Application will be available at:"
    print_success "  Frontend: http://localhost:5173"
    print_success "  Backend:  http://localhost:3001"
    echo ""
    
    npm run dev
}

# Main installation function
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    SQL Analyst Installer                     ║"
    echo "║                One-Click Installation Script                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the SQL Analyst project root directory."
        exit 1
    fi

    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Please install Node.js 16 or higher and try again."
        print_status "Download from: https://nodejs.org/"
        exit 1
    fi

    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js which includes npm."
        exit 1
    fi

    print_success "All prerequisites are satisfied!"

    # Get database configuration
    echo ""
    print_status "Database Configuration"
    echo "Please provide your MySQL database credentials:"
    
    read -p "Database Host [127.0.0.1]: " DB_HOST
    DB_HOST=${DB_HOST:-127.0.0.1}
    
    read -p "Database Port [3306]: " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "Database Name [preart]: " DB_NAME
    DB_NAME=${DB_NAME:-preart}
    
    read -p "Database Username: " DB_USER
    if [ -z "$DB_USER" ]; then
        print_error "Database username is required."
        exit 1
    fi
    
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        print_error "Database password is required."
        exit 1
    fi

    # Test database connection
    if check_mysql_connection; then
        create_database
    else
        print_warning "Database connection failed. You may need to:"
        print_warning "1. Start MySQL service"
        print_warning "2. Check your credentials"
        print_warning "3. Create the database manually"
        echo ""
        read -p "Continue with installation anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Installation cancelled."
            exit 1
        fi
    fi

    # Install dependencies
    echo ""
    print_status "Installing dependencies..."
    install_dependencies
    print_success "Dependencies installed successfully!"

    # Setup environment
    echo ""
    print_status "Setting up environment..."
    setup_environment

    # Final success message
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Installation Complete!                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    print_success "SQL Analyst has been installed successfully!"
    echo ""
    print_status "Next steps:"
    print_status "1. The application will start automatically"
    print_status "2. Open your browser to http://localhost:5173"
    print_status "3. Configure any additional settings in the app"
    echo ""
    print_status "To start the application manually later, run:"
    print_status "  npm run dev"
    echo ""

    # Ask if user wants to start the application now
    read -p "Start the application now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_application
    else
        print_status "Installation complete! Run 'npm run dev' to start the application."
    fi
}

# Run the main function
main "$@" 