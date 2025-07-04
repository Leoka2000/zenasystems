import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import BluetoothTemperature from './bluetooth/bluetooth';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-gray-50 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />

                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-gray-50 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-gray-50 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full " />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min bg-gray-50 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full " />
                        <BluetoothTemperature />
                </div>
            </div>
        </AppLayout>
    );
}
