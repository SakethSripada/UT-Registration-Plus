import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { OptionsStore } from '@shared/storage/OptionsStore';
import { Button } from '@views/components/common/Button';
import { ExtensionRootWrapper } from '@views/components/common/ExtensionRoot/ExtensionRoot';
import clsx from 'clsx';
import SelectionPlusIcon from '~icons/ph/selection-plus';
import CustomBlockForm from './CustomBlockForm';
import type { CustomBlockDraft } from './customBlockUtils';

interface Props {
    onCreate?: (block: CustomBlockDraft) => void | Promise<void>;
}

export default function AddCustomBlockPopover({ onCreate }: Props) {
    const reducedMotion = OptionsStore.useStore(store => store.enableReducedMotion);
    return (
        <Popover>
            <PopoverButton as={Button} color='ut-black' size='small' variant='minimal' icon={SelectionPlusIcon}>
                Add Block
            </PopoverButton>
            <PopoverPanel
                as={ExtensionRootWrapper}
                anchor='bottom start'
                transition={!reducedMotion}
                className={clsx(
                    'box-border mt-spacing-3 w-[400px] max-w-[calc(100vw-2rem)] z-30 rounded border border-ut-offwhite/50 bg-white text-theme-black px-spacing-7 py-spacing-6 shadow-[5px_5px_8px_rgba(26,32,36,0.05)]',
                    !reducedMotion &&
                        'transition data-[closed]:(opacity-0 scale-95) data-[enter]:(ease-out-expo duration-150) data-[leave]:(ease-out duration-50)'
                )}
            >
                {({ close }) => <CustomBlockForm onSave={draft => onCreate?.(draft)} onClose={close} />}
            </PopoverPanel>
        </Popover>
    );
}
