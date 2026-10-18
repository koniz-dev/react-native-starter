import { AccessibilityInfo, Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

describe('useAnnouncement', () => {
  it('reads a message out on iOS when it appears, and again when its repeat key changes', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.replaceProperty(Platform, 'OS', 'ios');
    const { rerender } = renderHook(
      ({ message, repeatKey }: { message: string | null; repeatKey: number }) =>
        useAnnouncement(message, repeatKey),
      { initialProps: { message: null, repeatKey: 0 } }
    );
    expect(announce).not.toHaveBeenCalled();

    rerender({ message: 'Saved', repeatKey: 1 });
    rerender({ message: 'Saved', repeatKey: 1 });
    expect(announce).toHaveBeenCalledTimes(1);

    rerender({ message: 'Saved', repeatKey: 2 });
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('Saved');
  });

  it('leaves Android to the live region', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.replaceProperty(Platform, 'OS', 'android');
    renderHook(() => useAnnouncement('Saved'));
    expect(announce).not.toHaveBeenCalled();
  });
});
