import type { CustomBlock } from '@shared/types/CustomBlock';
import { customBlockFromDraft } from '@shared/util/customBlocks';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AddCustomBlockPopover from '@views/components/calendar/AddCustomBlockPopover';
import CustomBlockForm from '@views/components/calendar/CustomBlockForm';
import { DEFAULT_BLOCK } from '@views/components/calendar/customBlockUtils';
import EditCustomBlockOverlay from '@views/components/calendar/EditCustomBlockOverlay';
import { Button } from '@views/components/common/Button';
import Text from '@views/components/common/Text/Text';
import { useState } from 'react';

const exampleBlock = customBlockFromDraft(
    {
        ...DEFAULT_BLOCK,
        name: 'Longhorn Dev. Meeting',
        days: ['Monday', 'Wednesday'],
    },
    'example-schedule',
    'example-block'
);

const meta = {
    title: 'Components/Calendar/CustomBlockDialogs',
    component: CustomBlockForm,
    args: { onSave: () => undefined, onClose: () => undefined },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof CustomBlockForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Creation: Story = {
    render: () => (
        <div className='w-[400px] rounded border border-ut-offwhite/50 bg-white px-spacing-7 py-spacing-6'>
            <CustomBlockForm onSave={() => undefined} onClose={() => undefined} />
        </div>
    ),
};

export const Editing: Story = {
    render: () => (
        <div className='w-[455px] rounded border border-ut-offwhite/50 bg-white px-spacing-7 py-spacing-6'>
            <CustomBlockForm
                block={exampleBlock}
                onSave={() => undefined}
                onDelete={() => undefined}
                onClose={() => undefined}
            />
        </div>
    ),
};

export const MockedOperations: Story = {
    render: () => {
        const [blocks, setBlocks] = useState<CustomBlock[]>([exampleBlock]);
        const [editing, setEditing] = useState<number | null>(null);
        const selected = editing === null ? undefined : blocks[editing];
        return (
            <div className='flex h-[650px] w-[900px] max-w-[95vw] border border-ut-offwhite/50'>
                <aside className='w-40 shrink-0 border-r border-ut-offwhite/50 p-spacing-5'>
                    <Text>Schedule sidebar</Text>
                </aside>
                <div className='min-w-0 flex flex-1 flex-col'>
                    <div className='p-spacing-5'>
                        <AddCustomBlockPopover
                            onCreate={block =>
                                setBlocks(previous => [
                                    ...previous,
                                    customBlockFromDraft(block, 'example-schedule', crypto.randomUUID()),
                                ])
                            }
                        />
                    </div>
                    <div className='relative min-h-0 flex-1 p-spacing-5'>
                        <div className='flex flex-col gap-spacing-3'>
                            {blocks.map((block, index) => (
                                <Button
                                    key={block.id}
                                    color='ut-black'
                                    variant='outline'
                                    onClick={() => setEditing(index)}
                                >
                                    {block.name}
                                </Button>
                            ))}
                        </div>
                        {selected && (
                            <EditCustomBlockOverlay
                                block={selected}
                                onClose={() => setEditing(null)}
                                onUpdate={block =>
                                    setBlocks(previous =>
                                        previous.map((value, index) =>
                                            index === editing
                                                ? customBlockFromDraft(block, 'example-schedule', value.id)
                                                : value
                                        )
                                    )
                                }
                                onDelete={() => setBlocks(previous => previous.filter((_, index) => index !== editing))}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    },
};

export const FailedSave: Story = {
    render: () => (
        <div className='w-[455px] rounded border border-ut-offwhite/50 bg-white px-spacing-7 py-spacing-6'>
            <CustomBlockForm
                block={exampleBlock}
                onClose={() => undefined}
                onSave={async () => {
                    throw new Error('Mock save failure');
                }}
            />
        </div>
    ),
};
