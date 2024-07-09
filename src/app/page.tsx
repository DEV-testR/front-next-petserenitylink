"use client";
import ECommerce from "@/components/Dashboard/E-commerce";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import {useEffect} from "react";
import {useRouter} from 'next/navigation';
export default function Home() {
    const router: any = useRouter();
    useEffect((): void => {
        if (!localStorage.getItem('accessToken')) {
            router.push('/auth/signin');
        }
    }, [router]);

    return (
            <DefaultLayout>
                <ECommerce/>
            </DefaultLayout>
    );
}
