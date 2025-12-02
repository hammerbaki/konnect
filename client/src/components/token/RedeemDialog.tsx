import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTokens } from "@/lib/TokenContext";
import { useToast } from "@/hooks/use-toast";

export function RedeemDialog() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { addCredits } = useTokens();
  const { toast } = useToast();

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      if (code.trim().toUpperCase() === "DEMO" || code.length > 5) {
        addCredits(5);
        setOpen(false);
        setCode("");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Token",
          description: "The code you entered is invalid or expired.",
        });
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm gap-2">
          <Ticket className="h-4 w-4" />
          Redeem Token
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redeem Access Token</DialogTitle>
          <DialogDescription>
            Enter the code provided by your administrator to add analysis credits to your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRedeem}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Token Code</Label>
              <Input
                id="code"
                placeholder="e.g. KNC-8829-XJ"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="uppercase tracking-widest font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !code}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Redeem Code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
