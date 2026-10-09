import { PopoverPanel } from '@headlessui/react';
import { OptionsStore } from '@shared/storage/OptionsStore';
import { ExtensionRootWrapper } from '@views/components/common/ExtensionRoot/ExtensionRoot';
import clsx from 'clsx';
import { type ComponentProps, useContext } from 'react';
import { CalendarGridBounds } from './CalendarGridBounds';
import CustomBlockForm from './CustomBlockForm';

function BlockPanel({ style, ...props }: ComponentProps<typeof ExtensionRootWrapper>) {
    const grid = useContext(CalendarGridBounds)?.current;
    const bounds = (grid?.closest('#calendar-content') ?? grid)?.getBoundingClientRect();
    const left = typeof style?.left === 'number' ? style.left : Number.parseFloat(String(style?.left));
    // Floating placement flips against the viewport; keep a flipped panel clear of the calendar sidebar too.
    const panelStyle =
        bounds && Number.isFinite(left)
            ? {
                  ...style,
                  left: Math.max(left, bounds.left + window.scrollX),
                  maxWidth: Math.min(bounds.width, window.innerWidth - bounds.left - 16),
              }
            : style;
    return <ExtensionRootWrapper {...props} style={panelStyle} />;
}

/** The owning PopoverButton anchors the form beside its block and handles dismissal. */
export default function CustomBlockPopover(props: ComponentProps<typeof CustomBlockForm>) {
    const reducedMotion = OptionsStore.useStore(store => store.enableReducedMotion);
    return (
        <PopoverPanel
            as={BlockPanel}
            anchor={{ to: 'right start', gap: 8, padding: 16 }}
            transition={!reducedMotion}
            role='dialog'
            aria-label={props.block ? `Edit ${props.block.name}` : 'Add custom block'}
            className={clsx(
                'box-border z-30 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-ut-offwhite/50 bg-white text-theme-black px-spacing-7 py-spacing-6 shadow-[5px_5px_8px_rgba(26,32,36,0.05)]',
                props.block ? 'w-[455px]' : 'w-[400px]',
                !reducedMotion &&
                    'transition data-[closed]:(opacity-0 scale-95) data-[enter]:(ease-out-expo duration-150) data-[leave]:(ease-out duration-50)'
            )}
        >
            {({ open }) => <CustomBlockForm key={String(open)} {...props} />}
        </PopoverPanel>
    );
}
