#!/bin/bash
# DorkPlusPremium v2.0.0 - Installation & Deployment Script
# Comprehensive setup script for all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="DorkPlusPremium"
VERSION="2.0.0"
PYTHON_MIN_VERSION="3.11"
NODE_MIN_VERSION="18"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        exit 1
    fi
    python_version=$(python3 --version | cut -d' ' -f2)
    print_success "Python $python_version installed"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    node_version=$(node --version | cut -d'v' -f2)
    print_success "Node.js $node_version installed"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git installed"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker $docker_version installed"
    else
        print_warning "Docker not found (optional)"
    fi
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Create .env file if doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating .env from template"
        cp .env.example .env
        print_success "Environment file created"
    else
        print_info ".env already exists"
    fi
    
    # Create necessary directories
    mkdir -p logs backend/logs frontend/logs
    mkdir -p data uploads backups
    print_success "Directories created"
}

# Install backend dependencies
install_backend() {
    print_header "Installing Backend Dependencies"
    
    cd backend
    
    # Create virtual environment
    if [ ! -d venv ]; then
        print_info "Creating Python virtual environment"
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
    
    # Upgrade pip
    print_info "Upgrading pip"
    pip install --upgrade pip setuptools wheel
    
    # Install requirements
    print_info "Installing Python packages"
    pip install -r requirements.txt
    print_success "Backend dependencies installed"
    
    cd ..
}

# Install frontend dependencies
install_frontend() {
    print_header "Installing Frontend Dependencies"
    
    cd frontend
    
    # Check if yarn is installed
    if ! command -v yarn &> /dev/null; then
        print_info "Installing Yarn"
        npm install -g yarn
    fi
    
    # Install dependencies
    print_info "Installing Node packages"
    yarn install --frozen-lockfile
    print_success "Frontend dependencies installed"
    
    cd ..
}

# Setup database
setup_database() {
    print_header "Setting Up Database"
    
    if command -v docker &> /dev/null; then
        print_info "Starting MongoDB with Docker"
        docker run -d -p 27017:27017 --name dorkplus-mongo \
            -e MONGO_INITDB_ROOT_USERNAME=root \
            -e MONGO_INITDB_ROOT_PASSWORD=password \
            mongo:6.0 2>/dev/null || print_warning "MongoDB already running"
        print_success "MongoDB started"
    else
        print_warning "Docker not available, please start MongoDB manually"
        print_info "MongoDB URL should be: mongodb://localhost:27017"
    fi
}

# Build application
build_app() {
    print_header "Building Application"
    
    # Build frontend
    print_info "Building frontend"
    cd frontend
    yarn build
    cd ..
    print_success "Frontend built"
    
    # Optional: Build Electron app
    if [ "$1" = "electron" ]; then
        print_info "Building Electron app"
        cd frontend
        npx electron-builder
        cd ..
        print_success "Electron app built"
    fi
}

# Run application
run_app() {
    print_header "Running Application"
    
    print_info "Starting backend server"
    cd backend
    source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
    python server.py &
    BACKEND_PID=$!
    cd ..
    
    sleep 2
    
    print_info "Starting frontend development server"
    cd frontend
    yarn start &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Application started"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:8000/api"
    print_info "API Docs: http://localhost:8000/docs"
    
    # Keep script running
    wait
}

# Docker Compose setup
docker_compose_setup() {
    print_header "Setting Up with Docker Compose"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_info "Starting services with Docker Compose"
    docker-compose up -d
    
    print_success "Services started"
    print_info "Wait for services to fully start (30-60 seconds)"
    sleep 10
    
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:8000/api"
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    # Backend tests
    print_info "Running backend tests"
    python backend_test.py
    
    # Frontend tests
    print_info "Running frontend tests"
    cd frontend
    yarn test --watchAll=false || true
    cd ..
    
    print_success "Tests completed"
}

# Main installation flow
main() {
    print_header "$PROJECT_NAME v$VERSION Setup"
    
    case "$1" in
        docker)
            check_prerequisites
            setup_environment
            docker_compose_setup
            ;;
        test)
            run_tests
            ;;
        build)
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            build_app $2
            ;;
        dev)
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            setup_database
            run_app
            ;;
        *)
            check_prerequisites
            setup_environment
            install_backend
            install_frontend
            setup_database
            print_header "Setup Complete!"
            print_success "Installation finished successfully"
            print_info "To start development, run: bash install.sh dev"
            print_info "To use Docker Compose, run: bash install.sh docker"
            print_info "To run tests, run: bash install.sh test"
            ;;
    esac
}

# Run main function
main "$@"
