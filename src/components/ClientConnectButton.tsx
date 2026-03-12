"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/client";

export default function ClientConnectButton() {
    return (
        // suppressHydrationWarning: thirdweb's internal CopyIcon renders a <button>
        // inside a <Styled(button)>, causing a nested-button hydration warning.
        // This is a known thirdweb SDK issue we cannot fix from our side.
        <div suppressHydrationWarning>
            <ConnectButton
                client={client}
                theme={"dark"}
                connectButton={{ className: "!rounded-full text-sm font-geist-sans" }}
            />
        </div>
    );
}
