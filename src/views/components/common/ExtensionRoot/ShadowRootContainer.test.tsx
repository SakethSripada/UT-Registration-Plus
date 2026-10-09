import '../../../../../.storybook/chrome-mock';
import { OptionsStore } from '@shared/storage/OptionsStore';
import { act, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import ShadowRootContainer from './ShadowRootContainer';

vi.mock('virtual:uno.css', () => ({}));
vi.mock('virtual:inline-styles', () => ({ default: {} }));

it('retains its shadow root while portal content is suspended', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    await OptionsStore.preload();
    let ready = false;
    const { promise: pending, resolve } = Promise.withResolvers<void>();
    function Content() {
        if (!ready) throw pending;
        return <span>Loaded</span>;
    }
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
        await act(() =>
            root.render(
                <StrictMode>
                    <Suspense fallback={<span>Loading</span>}>
                        <ShadowRootContainer>
                            <Content />
                        </ShadowRootContainer>
                    </Suspense>
                </StrictMode>
            )
        );
        expect(host.textContent).toContain('Loading');
        await act(async () => {
            ready = true;
            resolve();
            await pending;
        });
        expect(host.querySelector('.shadow-root-container')?.shadowRoot?.textContent).toBe('Loaded');
    } finally {
        await act(() => root.unmount());
        host.remove();
        vi.unstubAllGlobals();
    }
});
