import type { Meta, StoryObj } from '@storybook/react-vite';
import StackRecordingReplica from './StackRecordingReplica';

interface StackRecordingReplicaStoryArgs {
  visualRegressionMode: boolean;
  hideInteractiveOverlay: boolean;
}

const meta: Meta<StackRecordingReplicaStoryArgs> = {
  title: 'Components/StackRecordingReplica',
  tags: ['autodocs'],
  args: {
    visualRegressionMode: true,
    hideInteractiveOverlay: true,
  },
  argTypes: {
    visualRegressionMode: {
      control: { type: 'boolean' },
    },
    hideInteractiveOverlay: {
      control: { type: 'boolean' },
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background:
            'radial-gradient(circle at 20% 10%, rgba(98, 129, 255, 0.22), transparent 36%), linear-gradient(140deg, #070b16 0%, #0c1324 45%, #111a2e 100%)',
        }}
      >
        <div style={{ width: 'min(100%, 1502px)' }}>
          <StackRecordingReplica
            visualRegressionMode={args.visualRegressionMode}
            hideInteractiveOverlay={args.hideInteractiveOverlay}
            disableVideoFilter
            className="storybook-stack-recording"
          />
        </div>
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<StackRecordingReplicaStoryArgs>;

export const LiveStackScene: Story = {};
