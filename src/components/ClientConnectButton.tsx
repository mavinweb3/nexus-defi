"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/client";

export default function ClientConnectButton() {
    return (
        <ConnectButton
            client={client}
            theme={"dark"}
            connectButton={{ className: "!rounded-full text-sm font-geist-sans" }}
        />
    );
}
