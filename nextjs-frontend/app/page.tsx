import { NavBar } from "@/app/components/navbar"
import { DevTokenCopier } from "./ui/token-copier";
import { Show } from "@clerk/nextjs";


export default function Home() {
  return (
    <main className="p-6">     
      <NavBar /> 
      <div>
        <span>Page Content</span>
        <Show when="signed-in">
          <DevTokenCopier />
        </Show>
        
      </div>   
    </main>
  );
}
