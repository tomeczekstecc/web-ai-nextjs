import {DomainLayout} from "@/components/domain-layout"

export default async function WizardDemoLayout({
                                                   children,
                                                   params,
                                               }: {
    params: Promise<{ id: string }>
    children: React.ReactNode
}) {
    const {id} = await params

    return (
        <DomainLayout breadcrumbs={[
            {label: "Start", href: "/dashboard"},
            {label: "Zadania", href: "/wizard-demo"},
            {label: `Edycja zadania #${id}`},
        ]}>
            <div className="px-4 pb-8 lg:px-6">
                {children}
            </div>
        </DomainLayout>
    )
}
