import { booleanArg, enumType, idArg, mutationType, nonNull, stringArg } from 'nexus'
import { CodeLanguageEnum, FrontendFrameworkEnum, NavItemEnum, SupportedBundlerEnum, TestingTypeEnum, WizardNavigateDirectionEnum } from '../enumTypes/gql-WizardEnums'
import { Wizard } from './gql-Wizard'

export const mutation = mutationType({
  definition (t) {
    t.field('devRelaunch', {
      type: 'Boolean',
      description: 'Development only: Triggers or dismisses a prompted refresh by touching the file watched by our development scripts',
      args: {
        action: nonNull(enumType({
          name: 'DevRelaunchAction',
          members: ['trigger', 'dismiss'],
        }).asArg()),
      },
      resolve: async (source, args, ctx) => {
        if (args.action === 'trigger') {
          await ctx.actions.dev.triggerRelaunch()
        } else {
          ctx.actions.dev.dismissRelaunch()
        }

        return true
      },
    })

    t.field('internal_triggerIpcToLaunchpad', {
      type: 'Boolean',
      args: {
        msg: nonNull(stringArg()),
      },
      resolve: (root, args, ctx) => {
        ctx.emitter.toLaunchpad(args.msg)

        return true
      },
    })

    t.field('internal_triggerIpcToApp', {
      type: 'Boolean',
      resolve: (root, args, ctx) => {
        ctx.emitter.toApp('someData')

        return true
      },
    })

    t.field('internal_clearLatestProjectCache', {
      type: 'Boolean',
      resolve: (source, args, ctx) => {
        ctx.actions.project.clearLatestProjectCache()

        return true
      },
    })

    t.nonNull.field('clearActiveProject', {
      type: 'Query',
      resolve: (root, args, ctx) => {
        ctx.actions.project.clearActiveProject()

        return {}
      },
    })

    t.field('wizardSetTestingType', {
      type: Wizard,
      description: 'Sets the current testing type we want to use',
      args: { type: nonNull(TestingTypeEnum) },
      resolve: (root, args, ctx) => {
        return ctx.actions.wizard.setTestingType(args.type)
      },
    })

    t.field('wizardSetFramework', {
      type: Wizard,
      description: 'Sets the frontend framework we want to use for the project',
      args: { framework: nonNull(FrontendFrameworkEnum) },
      resolve: (_, args, ctx) => ctx.actions.wizard.setFramework(args.framework),
    })

    // TODO: Move these 3 to a single wizardUpdate(input: WizardUpdateInput!)
    t.field('wizardSetBundler', {
      type: Wizard,
      description: 'Sets the frontend bundler we want to use for the project',
      args: {
        bundler: nonNull(SupportedBundlerEnum),
      },
      resolve: (root, args, ctx) => ctx.actions.wizard.setBundler(args.bundler),
    })

    t.field('wizardSetCodeLanguage', {
      type: Wizard,
      description: 'Sets the language we want to use for the config file',
      args: { language: nonNull(CodeLanguageEnum) },
      resolve: (_, args, ctx) => ctx.actions.wizard.setCodeLanguage(args.language),
    })

    t.field('wizardNavigate', {
      type: Wizard,
      args: {
        direction: nonNull(WizardNavigateDirectionEnum),
      },
      description: 'Navigates backward in the wizard',
      // FIXME: remove the emitter from there it's a temporary fix
      resolve: async (_, args, ctx) => {
        const res = await ctx.actions.wizard.navigate(args.direction)

        ctx.emitter.toLaunchpad()

        return res
      },
    })

    t.field('wizardInstallDependencies', {
      type: Wizard,
      description: 'Installs the dependencies for the component testing step',
      resolve: (root, args, ctx) => {
        // ctx.wizardData
        return ctx.wizardData
      },
    })

    t.field('wizardValidateManualInstall', {
      type: Wizard,
      description: 'Validates that the manual install has occurred properly',
      resolve: (root, args, ctx) => {
        ctx.actions.wizard.validateManualInstall()

        return ctx.wizardData
      },
    })

    t.field('launchpadSetBrowser', {
      type: 'Query',
      description: 'Sets the active browser',
      args: {
        id: nonNull(idArg({
          description: 'ID of the browser that we want to set',
        })),
      },
      resolve: (root, args, ctx) => {
        ctx.actions.app.setActiveBrowser(args.id)

        return {}
      },
    })

    t.field('appCreateConfigFile', {
      type: 'App',
      args: {
        code: nonNull('String'),
        configFilename: nonNull('String'),
      },
      description: 'Create a Cypress config file for a new project',
      resolve: async (root, args, ctx) => {
        await ctx.actions.project.createConfigFile(args)

        return ctx.appData
      },
    })

    t.field('appCreateComponentIndexHtml', {
      type: 'App',
      args: {
        template: nonNull('String'),
      },
      description: 'Create an Index HTML file for a new component testing project',
      resolve: async (root, args, ctx) => {
        await ctx.actions.project.createComponentIndexHtml(args.template)

        return ctx.appData
      },
    })

    t.nonNull.field('generateSpecFromStory', {
      type: 'Wizard',
      description: 'Generate spec from Storybook story',
      args: {
        storyPath: nonNull('String'),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.storybook.generateSpecFromStory(args.storyPath)

        return ctx.wizardData
      },
    })

    t.field('navigationMenuSetItem', {
      type: 'NavigationMenu',
      description: 'Set the current navigation item',
      args: { type: nonNull(NavItemEnum) },
      resolve: (root, args, ctx) => {
        ctx.actions.wizard.setSelectedNavItem(args.type)

        return ctx.wizard
      },
    })

    t.field('login', {
      type: 'Query',
      description: 'Auth with Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.auth.login()

        return {}
      },
    })

    t.field('logout', {
      type: 'Query',
      description: 'Log out of Cypress Cloud',
      async resolve (_root, args, ctx) {
        await ctx.actions.auth.logout()

        return {}
      },
    })

    t.field('initializeOpenProject', {
      type: 'Wizard',
      description: 'Initializes open_project global singleton to manager current project state',
      async resolve (_root, args, ctx) {
        await ctx.actions.wizard.initializeOpenProject()

        return ctx.wizardData
      },
    })

    t.field('launchOpenProject', {
      type: 'App',
      description: 'Launches project from open_project global singleton',
      async resolve (_root, args, ctx) {
        if (!ctx.wizardData.chosenTestingType) {
          throw Error('Cannot launch project without chosen testing type')
        }

        await ctx.actions.project.launchProject(ctx.wizardData.chosenTestingType, {})

        return ctx.appData
      },
    })

    t.nonNull.field('addProject', {
      type: 'App',
      description: 'Add project to projects array and cache it',
      args: {
        path: nonNull(stringArg()),
        open: booleanArg({ description: 'Whether to open the project when added' }),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.project.addProject(args)

        return ctx.appData
      },
    })

    t.nonNull.field('removeProject', {
      type: 'App',
      description: 'Remove project from projects array and cache',
      args: {
        path: nonNull(stringArg()),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.project.removeProject(args.path)

        return ctx.appData
      },
    })

    t.nonNull.field('setActiveProject', {
      type: 'App',
      description: 'Set active project to run tests on',
      args: {
        path: nonNull(stringArg()),
      },
      async resolve (_root, args, ctx) {
        await ctx.actions.project.setActiveProject(args.path)

        return ctx.coreData.app
      },
    })

    t.nonNull.field('setCurrentSpec', {
      type: 'Project',
      description: 'Set the current spec under test',
      args: {
        id: nonNull(idArg()),
      },
      resolve (_root, args, ctx) {
        if (!ctx.activeProject) {
          throw Error(`Cannot set spec without active project!`)
        }

        ctx.actions.project.setCurrentSpec(args.id)

        return ctx.activeProject
      },
    })
  },
})