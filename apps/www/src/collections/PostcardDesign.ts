import { CollectionConfig } from 'payload'

export const PostcardDesign: CollectionConfig = {
  slug: 'postcard-designs',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        createdBy: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        createdBy: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return {
        createdBy: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'imageOriginal',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'The original uploaded image',
      },
    },
    {
      name: 'frontImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'The image that will be printed on the card',
      },
    },
    {
      name: 'imageVariants',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'AI-generated variants of the original image',
      },
    },
    {
      name: 'backgroundColor',
      type: 'text',
      defaultValue: '#ffffff',
    },
    {
      name: 'textColor',
      type: 'text',
      defaultValue: '#000000',
    },
    {
      name: 'font',
      type: 'select',
      options: [
        { label: 'Sans Serif', value: 'sans' },
        { label: 'Serif', value: 'serif' },
        { label: 'Handwritten', value: 'handwritten' },
        { label: 'Decorative', value: 'decorative' },
      ],
      defaultValue: 'sans',
    },
    {
      name: 'layout',
      type: 'select',
      options: [
        { label: 'Full Image', value: 'full-image' },
        { label: 'Split Horizontal', value: 'split-horizontal' },
        { label: 'Split Vertical', value: 'split-vertical' },
        { label: 'Border Frame', value: 'border-frame' },
      ],
      defaultValue: 'full-image',
    },
    {
      name: 'defaultMessage',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Holiday', value: 'holiday' },
        { label: 'Birthday', value: 'birthday' },
        { label: 'Thank You', value: 'thankyou' },
        { label: 'Greeting', value: 'greeting' },
        { label: 'Travel', value: 'travel' },
        { label: 'Custom', value: 'custom' },
      ],
      defaultValue: 'custom',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        condition: () => false,
      },
      hooks: {
        beforeChange: [
          ({ req, operation, data }) => {
            if (operation === 'create' && req.user) {
              data.createdBy = req.user.id
              return data
            }
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.createdBy = req.user.id
          // If no frontImage is specified, use the imageOriginal
          if (!data.frontImage && data.imageOriginal) {
            data.frontImage = data.imageOriginal
          }
        }
        return data
      },
    ],
  },
}