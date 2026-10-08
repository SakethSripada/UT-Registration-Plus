import { FocusTrap } from '@headlessui/react';
import CustomBlockForm from './CustomBlockForm';
import type { CustomBlockDraft } from './customBlockUtils';

interface Props {
    block: CustomBlockDraft;
    onUpdate: (block: CustomBlockDraft) => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onClose: () => void;
}

/** Render inside the calendar grid's positioned container so the sidebar stays uncovered. */
export default function EditCustomBlockOverlay({ block, onUpdate, onDelete, onClose }: Props) {
    return (
        <div className='absolute inset-0 z-30 flex items-center justify-center p-spacing-5'>
            <button
                type='button'
                aria-label='Close custom block editor'
                className='absolute inset-0 bg-slate-700/35'
                onClick={onClose}
            />
            <FocusTrap
                role='dialog'
                aria-label={`Edit ${block.name}`}
                onKeyDown={event => {
                    if (event.key === 'Escape') {
                        event.stopPropagation();
                        onClose();
                    }
                }}
                className='relative max-h-full w-[455px] max-w-full overflow-y-auto rounded border border-ut-offwhite/50 bg-white text-theme-black px-spacing-7 py-spacing-6 shadow-[5px_5px_8px_rgba(26,32,36,0.05)]'
            >
                <CustomBlockForm block={block} onSave={onUpdate} onDelete={onDelete} onClose={onClose} />
            </FocusTrap>
        </div>
    );
}
