# Contributing to Tally Endpoint

Thanks for your interest in contributing! Here's how to get started.

## Development setup

```bash
git clone https://github.com/arthurmonnet/tally-endpoint
cd tally-endpoint
npm install
cp .env.example .env.local  # fill in your values
npm run dev
```

## Running tests

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
npm run type-check    # TypeScript type checking
```

## Submitting changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and `npm run type-check` to verify
5. Open a pull request with a clear description

## Commit messages

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat: add new stats field
fix: handle missing date parameter
docs: update API examples
test: add coverage for GET endpoint
```

## Reporting bugs

Open an [issue](https://github.com/arthurmonnet/tally-endpoint/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
