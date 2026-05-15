import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    const heading = screen.getByText(/赋能千万先锋的/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders the Pioneer AI logo', () => {
    render(<HomePage />);
    const logos = screen.getAllByText('AI');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders the description text', () => {
    render(<HomePage />);
    const description = screen.getByText(/为全行业开发者与商户提供/i);
    expect(description).toBeInTheDocument();
  });

  it('renders the PiLoginButton component', () => {
    render(<HomePage />);
    // Assuming PiLoginButton renders something testable, like a button
    const loginButton = screen.getByRole('button', { name: /同步 Pi Wallet 身份/i });
    expect(loginButton).toBeInTheDocument();
  });
});