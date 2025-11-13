import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';

describe('<HomeScreen />', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('React Native Paper');
    getByText('Material Design 3 Components');
  });

  test('renders all text variants section', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('Text Variants');
    getByText('Headline Small');
    getByText('Title Large');
  });

  test('renders buttons section', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('Buttons');
    getByText('Contained');
    getByText('Outlined');
    getByText('Text');
  });
});

