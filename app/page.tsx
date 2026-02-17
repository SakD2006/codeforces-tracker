import CodeforcesDashboard from "@/components/dashboard";
import PixelSnow from "@/components/PixelSnow";

export default function home(){
  return(
    <div className="min-h-screen bg-background dark">
      <PixelSnow
        variant="snowflake" 
        color="#78e0f5"
        pixelResolution={2000}
      />
      <CodeforcesDashboard />
    </div>
  )
}