# Contributing to Library Management System Backend

First off, thank you for considering contributing to the Library Management System Backend! It’s people like you that help improve the project and make it better for everyone.

## Getting Started

To contribute to this project, follow the steps below:

### Fork the Repository

1. Navigate to the [Library Management System Backend repository](https://github.com/subhranil002/Library-Management-System-Backend) on GitHub.
2. Click on the "Fork" button at the top right of the page to create a copy of the repository under your GitHub account.

### Clone the Repository

1. Open your terminal or command prompt.
2. Clone your forked repository to your local machine by running the following command (replace `your-username` with your GitHub username:

    ```sh
    git clone https://github.com/your-username/Library-Management-System-Backend.git
    ```

3. Navigate to the project directory:

    ```sh
    cd Library-Management-System-Backend
    ```

### Install Dependencies

You can use npm, Yarn, or Bun to install dependencies.

#### Using npm

1. Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install the project dependencies by running:

    ```sh
    npm install
    ```

#### Using Yarn

1. Make sure you have [Yarn](https://yarnpkg.com/) installed.
2. Install the project dependencies by running:

    ```sh
    yarn install
    ```

#### Using Bun

1. Make sure you have [Bun](https://bun.sh/) installed.
2. Install the project dependencies by running:

    ```sh
    bun install
    ```

### Set Up Environment Variables

1. Create a `.env` file in the root directory of the project.
2. Add the necessary environment variables as defined in `constants.js`. Example:

    ```env
    PORT=3500
    NODE_ENV=development
    CORS_ORIGIN=*
    MONGO_URI=your-mongo-uri
    DB_NAME=your-db-name
    CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
    CLOUDINARY_API_KEY=your-cloudinary-api-key
    CLOUDINARY_SECRET_KEY=your-cloudinary-secret-key
    CLOUDINARY_FOLDER=your-cloudinary-folder
    ACCESS_TOKEN_SECRET=your-access-token-secret
    ACCESS_TOKEN_EXPIRE=1h
    REFRESH_TOKEN_SECRET=your-refresh-token-secret
    REFRESH_TOKEN_EXPIRE=7d
    RAZORPAY_KEY_ID=your-razorpay-key-id
    RAZORPAY_SECRET=your-razorpay-secret
    SMTP_HOST=your-smtp-host
    SMTP_PORT=your-smtp-port
    SMTP_USERNAME=your-smtp-username
    SMTP_PASSWORD=your-smtp-password
    FINE_AMOUNT_PER_DAY=your-fine-amount-per-day
    ```

### Run the Project

1. Start the development server by running:

    #### Using npm

    ```sh
    npm run dev
    ```

    #### Using Yarn

    ```sh
    yarn run dev
    ```

    #### Using Bun

    ```sh
    bun run dev
    ```

2. The server should now be running on the port specified in your `.env` file (default is 3500). You can access the API at `http://localhost:3500/api/v1/healthcheck`.

### Make Changes

1. Create a new branch for your feature or bug fix:

    ```sh
    git checkout -b my-new-feature
    ```

2. Make your changes in the codebase.

### Commit and Push Changes

1. Add and commit your changes with a meaningful commit message:

    ```sh
    git add .
    git commit -m "<commit-message>"
    ```

2. Push your changes to your forked repository:

    ```sh
    git push origin my-new-feature
    ```

### Submit a Pull Request

1. Navigate to your forked repository on GitHub.
2. Click on the "Compare & pull request" button.
3. Provide a clear description of your changes and submit the pull request.
4. Your pull request will be reviewed, and any necessary feedback or changes will be communicated to you.

## How Can I Contribute?

There are several ways you can contribute to the project:

1. Reporting Bugs
2. Submitting Pull Requests
3. Improving Documentation

### Reporting Bugs

If you encounter a bug or issue with the project, follow these steps:

1. Check if the bug has already been reported by searching on GitHub under Issues.
2. If you're unable to find an open issue addressing the problem, open a new one.
3. Please include as much detail as possible. Fill out the required template, as the information it asks for helps us resolve issues faster.

### Submitting Pull Requests

To submit a pull request:

1. Fork the repository.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request: Create a new pull request

### Improving Documentation

Help us improve the documentation in any way you see fit. The documentation files are found in the `docs` directory of the repository.

## Code of Conduct

This project and everyone participating in it is governed by the Library Management System Backend Code of Conduct. By participating, you are expected to uphold this code.

## Styleguides

#### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Limit the first line to 72 characters or less.
- Reference issues and pull requests liberally after the first line.

### JavaScript Styleguide

Follow the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

## Additional Notes

### Issue and Pull Request Labels

This section explains what labels we use and what they mean.

- `bug`: A bug or issue with the project.
- `documentation`: Improvements or additions to documentation.
- `enhancement`: New feature or request.

## Thank You!

Thank you for considering contributing to the Library Management System Backend. Your support and contributions are greatly appreciated. Keep contributing and making the project better! ❤️
