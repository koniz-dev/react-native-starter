import { AccessibilityInfo, Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

describe('useAnnouncement', () => {
  it('reads a message out on iOS when it appears, and again when its repeat key changes', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.replaceProperty(Platform, 'OS', 'ios');
    const { rerender } = await renderHook(
      ({ message, repeatKey }: { message: string | null; repeatKey: number }) =>
        useAnnouncement(message, repeatKey),
      { initialProps: { message: null, repeatKey: 0 } }
    );
    expect(announce).not.toHaveBeenCalled();

    await rerender({ message: 'Saved', repeatKey: 1 });
    await rerender({ message: 'Saved', repeatKey: 1 });
    expect(announce).toHaveBeenCalledTimes(1);

    await rerender({ message: 'Saved', repeatKey: 2 });
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('Saved');
  });

  it('leaves Android to the live region', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.replaceProperty(Platform, 'OS', 'android');
    await renderHook(() => useAnnouncement('Saved'));
    expect(announce).not.toHaveBeenCalled();
  });
});
