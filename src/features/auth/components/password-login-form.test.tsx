import '@/i18n';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/lib/api/errors';

import { PasswordLoginForm } from './password-login-form';

describe('PasswordLoginForm', () => {
  it('shows field errors and does not submit when empty', async () => {
    const onSubmit = jest.fn();
    await render(<PasswordLoginForm onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the email and password', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await render(<PasswordLoginForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('login-email'), 'worker@poultryfarm.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'secret');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('worker@poultryfarm.com', 'secret'));
  });

  it("shows the server's message when login fails", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ApiError('http', 401, 'Invalid email or password'));
    await render(<PasswordLoginForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('login-email'), 'admin@poultryfarm.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText('Invalid email or password')).toBeOnTheScreen();
  });

  it('says the server is unreachable instead of a raw network error', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ApiError('network', 0, 'Network request failed'));
    await render(<PasswordLoginForm onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByTestId('login-email'), 'admin@poultryfarm.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'x');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText("Can't reach the server.")).toBeOnTheScreen();
  });
});
