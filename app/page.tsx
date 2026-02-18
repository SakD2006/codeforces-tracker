import CodeforcesDashboard from "@/components/dashboard";
import PixelSnow from "@/components/PixelSnow";

export default function home(){
  return(
    <div className="min-h-screen bg-background dark">
      <PixelSnow
        variant="snowflake" 
        colors={['#f5d02a', '#56d2f5', '#e846b5', '#46e85b']}
        pixelResolution={2000}
        density={0.3}
      />
      <CodeforcesDashboard />
    </div>
  )
}