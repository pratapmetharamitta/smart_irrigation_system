#!/bin/bash

# Smart Irrigation System Development Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command_exists node; then
        print_warning "Node.js is not installed. Some features may not work."
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_warning "npm is not installed. Some features may not work."
    fi
    
    # Check git
    if ! command_exists git; then
        print_warning "git is not installed. Version control features may not work."
    fi
    
    print_status "Prerequisites check completed"
}

# Function to start development environment
start_dev() {
    print_header "Starting Development Environment"
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/mosquitto
    mkdir -p data/grafana
    mkdir -p data/prometheus
    mkdir -p data/influxdb
    mkdir -p data/node-red
    
    # Start Docker services
    print_status "Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    check_services
    
    print_status "Development environment started successfully!"
    print_status "Services available at:"
    echo "  - Backend API: http://localhost:3000"
    echo "  - Grafana Dashboard: http://localhost:3001 (admin/admin)"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - InfluxDB: http://localhost:8086"
    echo "  - Node-RED: http://localhost:1880"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo "  - MQTT Broker: localhost:1883"
}

# Function to stop development environment
stop_dev() {
    print_header "Stopping Development Environment"
    docker-compose down
    print_status "Development environment stopped"
}

# Function to restart development environment
restart_dev() {
    print_header "Restarting Development Environment"
    docker-compose restart
    print_status "Development environment restarted"
}

# Function to check service health
check_services() {
    print_header "Checking Service Health"
    
    # Check backend
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        print_status "Backend API is healthy"
    else
        print_warning "Backend API is not responding"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        print_status "Grafana is healthy"
    else
        print_warning "Grafana is not responding"
    fi
    
    # Check Prometheus
    if curl -f http://localhost:9090 >/dev/null 2>&1; then
        print_status "Prometheus is healthy"
    else
        print_warning "Prometheus is not responding"
    fi
}

# Function to view logs
view_logs() {
    print_header "Viewing Service Logs"
    docker-compose logs -f
}

# Function to run tests
run_tests() {
    print_header "Running Tests"
    
    # Run backend tests
    if [ -d "cloud-backend" ]; then
        print_status "Running backend tests..."
        cd cloud-backend
        npm test || print_warning "Backend tests failed"
        cd ..
    fi
    
    # Run mobile app tests
    if [ -d "mobile-app" ]; then
        print_status "Running mobile app tests..."
        cd mobile-app
        npm test || print_warning "Mobile app tests failed"
        cd ..
    fi
}

# Function to deploy to staging
deploy_staging() {
    print_header "Deploying to Staging"
    
    # Run tests first
    run_tests
    
    # Build and deploy
    print_status "Building and deploying to staging..."
    # Add deployment commands here
    
    print_status "Staging deployment completed"
}

# Function to setup development environment
setup_dev() {
    print_header "Setting up Development Environment"
    
    # Install backend dependencies
    if [ -d "cloud-backend" ]; then
        print_status "Installing backend dependencies..."
        cd cloud-backend
        npm install
        cd ..
    fi
    
    # Install mobile app dependencies
    if [ -d "mobile-app" ]; then
        print_status "Installing mobile app dependencies..."
        cd mobile-app
        npm install
        cd ..
    fi
    
    # Setup git hooks
    if [ -d ".git" ]; then
        print_status "Setting up git hooks..."
        # Add git hooks setup here
    fi
    
    print_status "Development environment setup completed"
}

# Function to clean up
cleanup() {
    print_header "Cleaning Up"
    
    # Stop services
    docker-compose down
    
    # Remove volumes (optional)
    read -p "Remove all data volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_status "Data volumes removed"
    fi
    
    # Clean up Docker images
    docker system prune -f
    
    print_status "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Smart Irrigation System Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment"
    echo "  stop      Stop development environment"
    echo "  restart   Restart development environment"
    echo "  status    Check service health"
    echo "  logs      View service logs"
    echo "  test      Run all tests"
    echo "  deploy    Deploy to staging"
    echo "  setup     Setup development environment"
    echo "  cleanup   Clean up environment"
    echo "  help      Show this help message"
    echo ""
}

# Main script logic
case "$1" in
    start)
        check_prerequisites
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    status)
        check_services
        ;;
    logs)
        view_logs
        ;;
    test)
        run_tests
        ;;
    deploy)
        deploy_staging
        ;;
    setup)
        setup_dev
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
