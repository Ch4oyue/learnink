page : https://aromatic-bath-d04.notion.site/Automation-Workflow-dengan-n8n-d84e987bdb884d82a850a5c66568c13b

database page : https://www.notion.so/4b0feeeb49ae41549a1c950d2b6680ac?v=daf157f4ef944546b9bd18ebebdcd2c6&source=copy_link

{
  "database": {
    "name": "Content Management",
    "icon": "📝",
    "dataSource": {
      "name": "Content Management",
      "icon": "📝",
      "properties": [
        {
          "name": "Name",
          "type": "title",
          "description": "Judul Materi"
        },
        {
          "name": "Status",
          "type": "status",
          "description": "Status of content lifecycle",
          "options": [
            {
              "name": "Idea",
              "color": "gray",
              "group": "to_do"
            },
            {
              "name": "Draft",
              "color": "blue",
              "group": "in_progress"
            },
            {
              "name": "Ready to Publish",
              "color": "yellow",
              "group": "in_progress"
            },
            {
              "name": "Published",
              "color": "green",
              "group": "complete"
            }
          ]
        },
        {
          "name": "Track",
          "type": "select",
          "options": [
            {
              "name": "The Specialist",
              "color": "red"
            },
            {
              "name": "Life OS",
              "color": "blue"
            }
          ]
        },
        {
          "name": "Slug",
          "type": "text",
          "description": "Custom URL untuk integrasi web"
        },
        {
          "name": "Summary",
          "type": "text",
          "description": "Ringkasan singkat untuk meta description"
        },
        {
          "name": "Cover",
          "type": "file",
          "description": "Gambar cover modul"
        },
        {
          "name": "Level",
          "type": "select",
          "options": [
            {
              "name": "Pemula",
              "color": "red"
            },
            {
              "name": "Menengah",
              "color": "yellow"
            },
            {
              "name": "Lanjutan",
              "color": "pink"
            }
          ]
        },
        {
          "name": "Source",
          "type": "url"
        },
        {
          "name": "category",
          "type": "multi_select",
          "options": [
            {
              "name": "Automation 101",
              "color": "purple"
            }
          ]
        }
      ]
    }
  }
}