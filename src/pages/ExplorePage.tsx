import Marketplace from '@marketplace/components/Marketplace'

const noop = () => {}

export default function ExplorePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      <Marketplace onToast={noop} />
    </div>
  )
}
