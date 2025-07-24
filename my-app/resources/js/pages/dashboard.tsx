import React, { useEffect, useState } from 'react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import BluetoothTemperature from './bluetooth/bluetooth';
import Accelerometer from './bluetooth/accelerometer';
// Update the import path below to match the actual location and filename of your temperature-chart component.
// For example, if the file is named TemperatureChart.tsx in the same directory, use:

// Or, if the file is in a different location, adjust the path accordingly.

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {

    return (
        <AppLayout className="h-full" breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video  overflow-hidden rounded-xl border dark:border-2 border-sidebar-border/70 bg-gray-50 dark:bg-neutral-950 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />

                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border  dark:border-2  border-sidebar-border/70 bg-gray-50 dark:bg-neutral-950 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border  dark:border-2  border-sidebar-border/70 bg-gray-50 dark:bg-neutral-950 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border dark:border-2 border-sidebar-border/70 md:min-h-min dark:bg-neutral-950 bg-gray-50  dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full " />
     {/*<BluetoothTemperature />*/} 

                </div>
                 <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border dark:border-2 border-sidebar-border/70 md:min-h-min dark:bg-neutral-950 bg-gray-50  dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full " />
      <Accelerometer />

                </div>
            </div>
        </AppLayout>
    );
}
