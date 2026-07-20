import { initStripe, useStripe } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51NI6RJJlO98Mt1tpy1EJVt8YGEWmBjaYDBIbiKK3TicjVHJyQVwUEoDnTEJJfOaHDebDD7I0KNZ45HxJrisVNUDD006WpyiR5T';

export const initializeStripe = async () => {
  await initStripe({
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: 'merchant.com.mousa.transport',
  });
};

export { useStripe };
