import type { CustomBlock } from '@shared/types/CustomBlock';
import { customBlockFromDraft } from '@shared/util/customBlocks';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AddCustomBlockPopover from '@views/components/calendar/AddCustomBlockPopover';
import CalendarGrid from '@views/components/calendar/CalendarGrid';
import CustomBlockForm from '@views/components/calendar/CustomBlockForm';
import CustomBlockPopover from '@views/components/calendar/CustomBlockPopover';
import { DEFAULT_BLOCK } from '@views/components/calendar/customBlockUtils';
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
        return (
            <div className='flex h-[650px] w-[1100px] max-w-[95vw] border border-ut-offwhite/50'>
                <aside className='w-40 shrink-0 border-r border-ut-offwhite/50 p-spacing-5'>
                    <Text>Schedule sidebar</Text>
                </aside>
                <div className='min-w-0 flex flex-1 flex-col'>
                    <div className='p-spacing-5'>
                        <AddCustomBlockPopover
                            onCreate={draft =>
                                setBlocks(previous => [
                                    ...previous,
                                    customBlockFromDraft(draft, 'example-schedule', crypto.randomUUID()),
                                ])
                            }
                        />
                    </div>
                    <div className='min-h-0 flex-1 p-spacing-5'>
                        <CalendarGrid
                            onCreateBlock={draft =>
                                setBlocks(previous => [
                                    ...previous,
                                    customBlockFromDraft(draft, 'example-schedule', crypto.randomUUID()),
                                ])
                            }
                            customBlocks={blocks}
                            setCourse={() => undefined}
                            renderBlockEditor={(block, close) => (
                                <CustomBlockPopover
                                    block={block}
                                    onClose={close}
                                    onSave={draft =>
                                        setBlocks(previous =>
                                            previous.map(value =>
                                                value.id === block.id
                                                    ? customBlockFromDraft(draft, 'example-schedule', value.id)
                                                    : value
                                            )
                                        )
                                    }
                                    onDelete={() =>
                                        setBlocks(previous => previous.filter(value => value.id !== block.id))
                                    }
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
        );
    },
};
